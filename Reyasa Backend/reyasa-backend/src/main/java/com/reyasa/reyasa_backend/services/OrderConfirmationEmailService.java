
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Order;
import com.reyasa.reyasa_backend.entities.OrderItem;
import com.reyasa.reyasa_backend.repositories.OrderItemRepository;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderConfirmationEmailService {

    private final JavaMailSender mailSender;
    private final OrderItemRepository orderItemRepository;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendConfirmationEmail(Order order) {

        if (order == null || order.getUser() == null
                || order.getUser().getEmail() == null
                || order.getUser().getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Customer email is required"
            );
        }

        try {
            List<OrderItem> items =
                    orderItemRepository.findByOrder_IdOrderByIdAsc(
                            order.getId()
                    );

            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(senderEmail, "REYASA");
            helper.setTo(order.getUser().getEmail());
            helper.setSubject(
                    "REYASA - Your Order #" + order.getId()
                            + " is Confirmed"
            );

            StringBuilder productRows = new StringBuilder();

            for (OrderItem item : items) {

                String productName = escapeHtml(
                        item.getProduct().getName()
                );

                BigDecimal subtotal = item.getPrice().multiply(
                        BigDecimal.valueOf(item.getQuantity())
                );

                productRows.append("""
                        <tr>
                            <td style="padding:12px;border-bottom:1px solid #eee;">
                                %s<br>
                                <span style="color:#777;font-size:12px;">
                                    Size: %s
                                </span>
                            </td>
                            <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">
                                %d
                            </td>
                            <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
                                ₹%s
                            </td>
                        </tr>
                        """.formatted(
                        productName,
                        escapeHtml(item.getSize()),
                        item.getQuantity(),
                        subtotal.toPlainString()
                ));
            }

            String customerName = escapeHtml(
                    order.getUser().getFirstName()
            );

            if (order.getUser().getLastName() != null) {
                customerName += " " + escapeHtml(
                        order.getUser().getLastName()
                );
            }

            String html = """
                    <!DOCTYPE html>
                    <html>
                    <body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;">
                      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;">

                        <div style="text-align:center;padding:25px;background:#ffffff;">
                          <img src="cid:reyasaLogo"
                               alt="REYASA Logo"
                               width="150"
                               style="display:block;margin:auto;max-width:150px;">
                          <h2 style="color:#800000;margin-top:15px;">
                            ORDER CONFIRMED
                          </h2>
                        </div>

                        <div style="padding:25px;color:#333333;">
                          <p>Hello <strong>%s</strong>,</p>

                          <p>Great news! Your order has been confirmed by REYASA.</p>

                          <div style="background:#f9f3f3;padding:15px;border-radius:6px;">
                            <p><strong>Order ID:</strong> #%d</p>
                            <p><strong>Order Status:</strong>
                              <span style="color:green;">CONFIRMED</span>
                            </p>
                          </div>

                          <h3 style="color:#800000;margin-top:25px;">
                            Your Order Details
                          </h3>

                          <table style="width:100%%;border-collapse:collapse;">
                            <thead>
                              <tr style="background:#f5f5f5;">
                                <th style="padding:12px;text-align:left;">Product</th>
                                <th style="padding:12px;">Quantity</th>
                                <th style="padding:12px;text-align:right;">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              %s
                            </tbody>
                          </table>

                          <h3 style="text-align:right;color:#800000;">
                            Total Amount: ₹%s
                          </h3>

                          <p style="margin-top:25px;">
                            Thank you for shopping with REYASA.
                            We appreciate your trust and support!
                          </p>

                          <p style="text-align:center;margin-top:30px;color:#800000;font-weight:bold;">
                            Created with passion. Worn with love.
                          </p>
                        </div>

                      </div>
                    </body>
                    </html>
                    """.formatted(
                    customerName,
                    order.getId(),
                    productRows,
                    order.getTotalAmount().toPlainString()
            );

            helper.setText(html, true);

            ClassPathResource logo = new ClassPathResource(
                    "static/logo.png"
            );

            helper.addInline(
                    "reyasaLogo",
                    logo,
                    "image/png"
            );

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to send order confirmation email", e
            );
        }
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
