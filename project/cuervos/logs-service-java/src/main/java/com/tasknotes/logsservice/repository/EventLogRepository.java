package com.tasknotes.logsservice.repository;

import com.tasknotes.logsservice.model.EventLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventLogRepository extends MongoRepository<EventLog, String> {
}