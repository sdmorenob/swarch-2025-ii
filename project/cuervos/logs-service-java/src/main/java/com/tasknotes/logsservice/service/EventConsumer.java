package com.tasknotes.logsservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tasknotes.logsservice.model.EventLog;
import com.tasknotes.logsservice.repository.EventLogRepository;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EventConsumer {
    private final EventLogRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EventConsumer(EventLogRepository repository) {
        this.repository = repository;
    }

    @RabbitListener(queues = "#{logsQueue.name}")
    public void onMessage(Message message) {
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        String routingKey = message.getMessageProperties().getReceivedRoutingKey();
        try {
            JsonNode json = objectMapper.readTree(body);
            String entity = text(json, "entity");
            String eventType = text(json, "event_type");
            String userId = text(json, "user_id");
            EventLog log = new EventLog(routingKey, entity, eventType, userId, body);
            repository.save(log);
        } catch (Exception e) {
            // Guardar como raw en caso de error de parseo
            EventLog log = new EventLog(routingKey, null, null, null, body);
            repository.save(log);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v != null && !v.isNull() ? v.asText() : null;
    }
}