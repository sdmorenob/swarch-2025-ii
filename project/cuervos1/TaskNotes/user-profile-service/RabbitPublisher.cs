using RabbitMQ.Client;
using System;
using System.Text;
using System.Text.Json;

namespace UserProfileService;

public static class RabbitPublisher
{
    public static void Publish(string routingKey, object payload)
    {
        var url = Environment.GetEnvironmentVariable("RABBITMQ_URL");
        var host = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";
        var exchange = Environment.GetEnvironmentVariable("EXCHANGE_NAME") ?? "tasknotes.events";

        var factory = new ConnectionFactory();
        if (!string.IsNullOrWhiteSpace(url))
            factory.Uri = new Uri(url);
        else
            factory.HostName = host;
        using var connection = factory.CreateConnection();
        using var channel = connection.CreateModel();
        channel.ExchangeDeclare(exchange: exchange, type: ExchangeType.Topic, durable: true);

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
        var props = channel.CreateBasicProperties();
        props.ContentType = "application/json";
        props.DeliveryMode = 2;

        channel.BasicPublish(exchange: exchange, routingKey: routingKey, basicProperties: props, body: body);
    }
}