package co.edu.unal.campus.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("user")
public record User(
  @Id @Column("user_id") Long id,
  String name,
  String email
) {}