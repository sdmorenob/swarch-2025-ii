package com.proyecto.spring.social_service.config;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
        basePackages = "com.proyecto.spring.social_service.repository.relations",
        entityManagerFactoryRef = "relationsEntityManager",
        transactionManagerRef = "relationsTransactionManager"
)
public class RelationsDBConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.relations")
    public DataSource relationsDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean relationsEntityManager(
            @Qualifier("relationsDataSource") DataSource dataSource,
            HibernateJpaVendorAdapter jpaVendorAdapter) {

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.proyecto.spring.social_service.model.relations");
        em.setPersistenceUnitName("relations");
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
    public PlatformTransactionManager relationsTransactionManager(
            @Qualifier("relationsEntityManager") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}