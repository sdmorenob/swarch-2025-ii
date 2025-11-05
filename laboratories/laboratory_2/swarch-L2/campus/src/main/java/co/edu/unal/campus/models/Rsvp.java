package co.edu.unal.campus.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Table("rsvp")
public record Rsvp(
  @Id @Column("rsvp_id") Long id,
  @Column("user_id") Long userId,
  @Column("caev_id") Long eventId,

  @ReadOnlyProperty
  @Column("created_at") LocalDateTime createdAt,

  @ReadOnlyProperty
  @Column("updated_at") LocalDateTime updatedAt

) {}