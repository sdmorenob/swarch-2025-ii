package com.tasknotes.logsservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "event_logs")
public class EventLog {
    @Id
    private String id;

    private String routingKey;
    private String entity;
    private String eventType;
    private String userId;
    private String payload;
    private Instant createdAt;

    public EventLog() {}

    public EventLog(String routingKey, String entity, String eventType, String userId, String payload) {
        this.routingKey = routingKey;
        this.entity = entity;
        this.eventType = eventType;
        this.userId = userId;
        this.payload = payload;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getRoutingKey() { return routingKey; }
    public String getEntity() { return entity; }
    public String getEventType() { return eventType; }
    public String getUserId() { return userId; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(String id) { this.id = id; }
    public void setRoutingKey(String routingKey) { this.routingKey = routingKey; }
    public void setEntity(String entity) { this.entity = entity; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setPayload(String payload) { this.payload = payload; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}