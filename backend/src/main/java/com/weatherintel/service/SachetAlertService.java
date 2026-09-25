package com.weatherintel.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Fetches and parses the NDMA SACHET National Disaster Alert Portal's
 * public CAP (Common Alerting Protocol) RSS feed.
 * No API key or registration required - this is a public government feed.
 * Source: https://sachet.ndma.gov.in/
 */
@Service
public class SachetAlertService {

    private static final Logger logger = LoggerFactory.getLogger(SachetAlertService.class);
    private static final String FEED_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";

    private final RestTemplate restTemplate;
    private List<SachetAlert> cachedAlerts = new ArrayList<>();
    private LocalDateTime lastFetched = null;

    public SachetAlertService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(8))
                .build();
    }

    public static class SachetAlert {
        public String title;
        public String description;
        public String link;
        public String pubDate;
        public String guid;
        public String author;

        public SachetAlert(String title, String description, String link, String pubDate, String guid, String author) {
            this.title = title;
            this.description = description;
            this.link = link;
            this.pubDate = pubDate;
            this.guid = guid;
            this.author = author;
        }
    }

    /**
     * Returns the cached national alert list, refreshing from the live
     * government feed if the cache is older than 10 minutes.
     */
    public List<SachetAlert> getNationalAlerts() {
        if (lastFetched != null && lastFetched.isAfter(LocalDateTime.now().minusMinutes(10))) {
            return cachedAlerts;
        }

        try {
            String xml = restTemplate.getForObject(FEED_URL, String.class);
            List<SachetAlert> alerts = parseRssXml(xml);
            cachedAlerts = alerts;
            lastFetched = LocalDateTime.now();
            logger.info("Fetched {} live alerts from NDMA SACHET national feed", alerts.size());
            return alerts;
        } catch (Exception e) {
            logger.warn("Failed to fetch SACHET alert feed: {}. Returning last known cache ({} items).",
                    e.getMessage(), cachedAlerts.size());
            return cachedAlerts;
        }
    }

    private List<SachetAlert> parseRssXml(String xml) throws Exception {
        List<SachetAlert> results = new ArrayList<>();
        if (xml == null || xml.isBlank()) return results;

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes("UTF-8")));
        doc.getDocumentElement().normalize();

        NodeList items = doc.getElementsByTagName("item");
        for (int i = 0; i < items.getLength(); i++) {
            Element item = (Element) items.item(i);
            String title = textOf(item, "title");
            String description = textOf(item, "description");
            String link = textOf(item, "link");
            String pubDate = textOf(item, "pubDate");
            String guid = textOf(item, "guid");
            String author = textOf(item, "author");
            results.add(new SachetAlert(title, description, link, pubDate, guid, author));
        }
        return results;
    }

    private String textOf(Element parent, String tag) {
        NodeList nl = parent.getElementsByTagName(tag);
        if (nl.getLength() == 0) return "";
        return nl.item(0).getTextContent().trim();
    }
}