package com.tasknotes.logsservice.config;

import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class RabbitConfig {

    @Value("${logs.exchange}")
    private String exchangeName;

    @Value("${logs.queue}")
    private String queueName;

    @Value("${logs.bindings:}")
    private String bindingsEnv;

    @Bean
    public TopicExchange logsExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue logsQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    public Declarables bindingsDeclarables(Queue logsQueue, TopicExchange logsExchange) {
        List<String> keys = getBindingKeys();
        List<Declarable> declarables = new ArrayList<>();
        for (String key : keys) {
            declarables.add(BindingBuilder.bind(logsQueue).to(logsExchange).with(key));
        }
        return new Declarables(declarables);
    }

    private List<String> getBindingKeys() {
        if (bindingsEnv != null && !bindingsEnv.isBlank()) {
            return Arrays.stream(bindingsEnv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        // Defaults
        return List.of(
                "task.*",
                "note.*",
                "category.*",
                "tag.*",
                "user.updated"
        );
    }
}