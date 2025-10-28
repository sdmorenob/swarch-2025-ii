package com.tasknotes.logsservice;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableRabbit
public class LogsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LogsServiceApplication.class, args);
    }
}