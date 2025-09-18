package co.edu.unal.campus.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Table("campus_event")
public record CampusEvent(
  @Id @Column("caev_id") Long id,
  String title,
  String description,
  String location,
  @Column("event_date") LocalDateTime eventDate
){}