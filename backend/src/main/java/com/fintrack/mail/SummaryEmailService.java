package com.fintrack.mail;

import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

@Service
public class SummaryEmailService {
  @Value("${MAIL_HOST:}")
  private String mailHost;

  @Value("${MAIL_PORT:587}")
  private int mailPort;

  @Value("${MAIL_USERNAME:}")
  private String mailUsername;

  @Value("${MAIL_PASSWORD:}")
  private String mailPassword;

  @Value("${MAIL_FROM:}")
  private String mailFrom;

  public boolean send(String to, String subject, String body) {
    if (mailHost == null || mailHost.isBlank()) {
      System.out.println("SMTP not configured. Log-only email:\nTo: " + to + "\nSubject: " + subject + "\n\n" + body);
      return false;
    }

    String from = (mailFrom == null || mailFrom.isBlank()) ? mailUsername : mailFrom;
    if (from == null || from.isBlank()) {
      from = "no-reply@local";
    }

    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(mailHost);
    sender.setPort(mailPort);
    sender.setUsername(mailUsername);
    sender.setPassword(mailPassword);

    Properties props = new Properties();
    props.put("mail.smtp.auth", mailUsername != null && !mailUsername.isBlank());
    props.put("mail.smtp.starttls.enable", true);
    sender.setJavaMailProperties(props);

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(to);
    message.setSubject(subject);
    message.setText(body);

    sender.send(message);
    return true;
  }
}

