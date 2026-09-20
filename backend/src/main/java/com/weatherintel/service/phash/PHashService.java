package com.weatherintel.service.phash;

import org.imgscalr.Scalr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigInteger;

@Service
public class PHashService {

    private static final Logger logger = LoggerFactory.getLogger(PHashService.class);
    private static final int SIZE = 32;
    private static final int SMALLER_SIZE = 8;

    /**
     * Compute 64-bit Perceptual Hash (pHash) for an uploaded image.
     */
    public String computePHash(byte[] imageBytes) {
        try {
            ByteArrayInputStream bis = new ByteArrayInputStream(imageBytes);
            BufferedImage img = ImageIO.read(bis);
            if (img == null) {
                logger.warn("Could not decode image to compute pHash, returning fallback hash");
                return null;
            }
            return computePHash(img);
        } catch (Exception e) {
            logger.error("Error computing pHash: {}", e.getMessage(), e);
            return null;
        }
    }

    public String computePHash(BufferedImage srcImg) {
        try {
            // 1. Resize to 32x32 using imgscalr
            BufferedImage resized = Scalr.resize(srcImg, Scalr.Method.QUALITY, Scalr.Mode.FIT_EXACT, SIZE, SIZE);

            // 2. Convert to grayscale and get luminance matrix
            double[][] vals = new double[SIZE][SIZE];
            for (int x = 0; x < SIZE; x++) {
                for (int y = 0; y < SIZE; y++) {
                    int rgb = resized.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    vals[x][y] = 0.299 * r + 0.587 * g + 0.114 * b;
                }
            }

            // 3. Compute 2D Discrete Cosine Transform (DCT)
            double[][] dct = applyDCT(vals);

            // 4. Extract top-left 8x8 low frequencies (excluding DC coefficient at 0,0)
            double total = 0;
            int count = 0;
            for (int x = 0; x < SMALLER_SIZE; x++) {
                for (int y = 0; y < SMALLER_SIZE; y++) {
                    if (x == 0 && y == 0) continue;
                    total += dct[x][y];
                    count++;
                }
            }
            double mean = total / count;

            // 5. Construct 64-bit hash based on whether coefficient > mean
            StringBuilder hashBits = new StringBuilder();
            for (int x = 0; x < SMALLER_SIZE; x++) {
                for (int y = 0; y < SMALLER_SIZE; y++) {
                    hashBits.append(dct[x][y] > mean ? "1" : "0");
                }
            }

            // Convert 64-bit binary to 16-character hexadecimal representation
            BigInteger bi = new BigInteger(hashBits.toString(), 2);
            String hex = String.format("%016x", bi);
            logger.debug("Computed pHash: {}", hex);
            return hex;

        } catch (Exception e) {
            logger.error("Error executing pHash algorithm: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Compute Hamming distance between two 16-character hex pHash strings.
     * Distance represents number of differing bits out of 64.
     */
    public int calculateHammingDistance(String hash1, String hash2) {
        if (hash1 == null || hash2 == null || hash1.length() != 16 || hash2.length() != 16) {
            return 64; // Maximum divergence
        }
        BigInteger b1 = new BigInteger(hash1, 16);
        BigInteger b2 = new BigInteger(hash2, 16);
        BigInteger xor = b1.xor(b2);
        return xor.bitCount();
    }

    /**
     * Checks whether two images are likely duplicates based on Hamming distance threshold.
     * Threshold <= 10 bits difference typically signifies recycled/duplicate media.
     */
    public boolean isDuplicate(String hash1, String hash2, int threshold) {
        int distance = calculateHammingDistance(hash1, hash2);
        return distance <= threshold;
    }

    private double[][] applyDCT(double[][] f) {
        int n = SIZE;
        double[][] F = new double[n][n];

        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                double sum = 0.0;
                for (int i = 0; i < n; i++) {
                    for (int j = 0; j < n; j++) {
                        sum += Math.cos(((2 * i + 1) / (2.0 * n)) * u * Math.PI)
                             * Math.cos(((2 * j + 1) / (2.0 * n)) * v * Math.PI)
                             * f[i][j];
                    }
                }
                double cu = (u == 0) ? 1.0 / Math.sqrt(2) : 1.0;
                double cv = (v == 0) ? 1.0 / Math.sqrt(2) : 1.0;
                F[u][v] = 0.25 * cu * cv * sum;
            }
        }
        return F;
    }
}
