package co.edu.unal.campus.config;

import co.edu.unal.campus.protos.RecommendationGrpc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.grpc.client.GrpcChannelFactory;


@Configuration
public class GrpcClientConfig {

  @Bean
  RecommendationGrpc.RecommendationFutureStub recommendationFutureStub(GrpcChannelFactory channels) {
    // "reco" is the channel name from application.yml
    return RecommendationGrpc.newFutureStub(channels.createChannel("reco"));
  }

}