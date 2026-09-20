package com.weatherintel.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    @Value("${app.kafka.topic:weather.raw.ingestion}")
    private String topicName;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private KafkaConsumerWorker consumerWorker;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BlockingQueue<String> inMemoryBuffer = new LinkedBlockingQueue<>(50000);

    /**
     * High-velocity ingestion publisher.
     * Decouples incoming network ingestion from database writes.
     */
    public void publishRawIngestion(Map<String, Object> payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            String partitionKey = (String) payload.getOrDefault("city", "INDORE");

            if (kafkaEnabled && kafkaTemplate != null) {
                try {
                    kafkaTemplate.send(topicName, partitionKey, jsonPayload);
                    logger.debug("Successfully buffered message to Kafka topic '{}': key={}", topicName, partitionKey);
                    return;
                } catch (Exception e) {
                    logger.warn("Kafka cluster unreachable ({}), routing to asynchronous worker buffer", e.getMessage());
                }
            }

            // High-throughput asynchronous buffer
            inMemoryBuffer.offer(jsonPayload);
            dispatchFromBuffer();

        } catch (Exception e) {
            logger.error("Error serializing or buffering ingestion payload: {}", e.getMessage(), e);
        }
    }

    @Async
    public void dispatchFromBuffer() {
        String payload = inMemoryBuffer.poll();
        if (payload != null) {
            consumerWorker.processRawPayload(payload);
        }
    }
}
