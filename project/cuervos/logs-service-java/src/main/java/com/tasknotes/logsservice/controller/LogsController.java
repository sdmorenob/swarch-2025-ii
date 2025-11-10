package com.tasknotes.logsservice.controller;

import com.tasknotes.logsservice.dto.PageResponse;
import com.tasknotes.logsservice.model.EventLog;
import com.tasknotes.logsservice.repository.EventLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
public class LogsController {

    private final MongoTemplate mongoTemplate;
    private final EventLogRepository repository;

    @Autowired
    public LogsController(MongoTemplate mongoTemplate, EventLogRepository repository) {
        this.mongoTemplate = mongoTemplate;
        this.repository = repository;
    }

    @GetMapping("/logs")
    public PageResponse<EventLog> listLogs(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "routing_key", required = false) Optional<String> routingKey,
            @RequestParam(name = "entity", required = false) Optional<String> entity,
            @RequestParam(name = "event_type", required = false) Optional<String> eventType,
            @RequestParam(name = "user_id", required = false) Optional<String> userId,
            @RequestParam(name = "search", required = false) Optional<String> search
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 20;

        List<Criteria> criteriaList = new ArrayList<>();
        routingKey.filter(s -> !s.isBlank()).ifPresent(s -> criteriaList.add(Criteria.where("routingKey").is(s)));
        entity.filter(s -> !s.isBlank()).ifPresent(s -> criteriaList.add(Criteria.where("entity").is(s)));
        eventType.filter(s -> !s.isBlank()).ifPresent(s -> criteriaList.add(Criteria.where("eventType").is(s)));
        userId.filter(s -> !s.isBlank()).ifPresent(s -> criteriaList.add(Criteria.where("userId").is(s)));
        search.filter(s -> !s.isBlank()).ifPresent(s -> criteriaList.add(Criteria.where("payload").regex(s, "i")));

        Query query = new Query();
        if (!criteriaList.isEmpty()) {
            Criteria criteria = new Criteria();
            criteria.andOperator(criteriaList.toArray(new Criteria[0]));
            query.addCriteria(criteria);
        }

        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));

        long total = mongoTemplate.count(query, EventLog.class);

        int skip = (page - 1) * size;
        query.skip(skip).limit(size);

        List<EventLog> items = mongoTemplate.find(query, EventLog.class);

        return new PageResponse<>(items, total, page, size);
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<EventLog> getLog(@PathVariable("id") String id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}