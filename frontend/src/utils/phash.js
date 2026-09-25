/**
 * Client-Side Perceptual Hash (pHash) Calculator
 * Resizes image to 8x8 grayscale and generates a 64-bit hexadecimal fingerprint
 * to detect duplicated / recycled media instantly in browser!
 */

export function computeClientPHash(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return resolve(null);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 8;
                    canvas.height = 8;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 8, 8);

                    const imgData = ctx.getImageData(0, 0, 8, 8);
                    const data = imgData.data;

                    // Convert to grayscale values
                    const grays = [];
                    let sum = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                        grays.push(gray);
                        sum += gray;
                    }

                    const avg = sum / grays.length;

                    // Compute 64-bit binary string
                    let bits = '';
                    for (let i = 0; i < grays.length; i++) {
                        bits += grays[i] >= avg ? '1' : '0';
                    }

                    // Convert to 16-character hex string
                    let hex = '';
                    for (let i = 0; i < bits.length; i += 4) {
                        const chunk = bits.substring(i, i + 4);
                        hex += parseInt(chunk, 2).toString(16);
                    }

                    resolve(hex);
                } catch (err) {
                    console.warn('[pHash] Calculation failed:', err);
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

export function hammingDistance(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        const v1 = parseInt(hash1[i], 16);
        const v2 = parseInt(hash2[i], 16);
        let xor = v1 ^ v2;
        while (xor > 0) {
            distance += xor & 1;
            xor >>= 1;
        }
    }
    return distance;
}
