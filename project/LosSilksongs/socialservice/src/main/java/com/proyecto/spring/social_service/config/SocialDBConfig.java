package com.proyecto.spring.social_service.config;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.proyecto.spring.social_service.repository.social",
        entityManagerFactoryRef = "socialEntityManager",
        transactionManagerRef = "socialTransactionManager"
)
public class SocialDBConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.social")
    public DataSource socialDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public LocalContainerEntityManagerFactoryBean socialEntityManager(
            @Qualifier("socialDataSource") DataSource dataSource,
            HibernateJpaVendorAdapter jpaVendorAdapter) {

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.proyecto.spring.social_service.model.social");
        em.setPersistenceUnitName("social");
        em.setJpaVendorAdapter(jpaVendorAdapter);

        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.hbm2ddl.auto", "update");
        props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        props.put("hibernate.physical_naming_strategy",
                "org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl");

        em.setJpaPropertyMap(props);

        return em;
    }

    @Bean
    @Primary
    public PlatformTransactionManager socialTransactionManager(
            @Qualifier("socialEntityManager") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}