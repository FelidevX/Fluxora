package com.microservice.entrega.util;

import com.microservice.entrega.dto.ProductoEntregadoDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class EmailTemplateGenerator {

    public String generarEmailEntregaPedido(
            String nombreCliente,
            Long pedidoId,
            List<ProductoEntregadoDTO> productos,
            double totalPedido,
            String comentario,
            LocalDateTime fechaEntrega,
            Double precioCorriente,
            Double precioEspecial
    ) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">");
        html.append("<html xmlns=\"http://www.w3.org/1999/xhtml\">");
        html.append("<head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>");
        html.append("</head>");
        html.append("<body style=\"margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;\">");
        
        // Tabla contenedor principal
        html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" bgcolor=\"#f5f5f5\">");
        html.append("<tr><td align=\"center\" style=\"padding: 20px 0;\">");
        
        // Tabla de contenido (600px max-width)
        html.append("<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" bgcolor=\"#ffffff\" style=\"max-width: 600px;\">");
        
        // ========== HEADER ==========
        html.append("<tr><td bgcolor=\"#3b82f6\" style=\"padding: 30px 20px; text-align: center; color: #ffffff;\">");
        html.append("<h1 style=\"margin: 0; font-size: 28px; font-weight: bold;\">&#x2705; Pedido Entregado</h1>");
        html.append("<p style=\"margin: 10px 0 0 0; font-size: 16px;\">Tu pedido ha sido entregado exitosamente</p>");
        html.append("</td></tr>");
        
        // ========== CONTENIDO PRINCIPAL ==========
        html.append("<tr><td style=\"padding: 30px 20px;\">");
        
        // Saludo
        html.append("<p style=\"font-size: 16px; margin: 0 0 10px 0; color: #333;\">Hola <strong style=\"color: #3b82f6;\">");
        html.append(nombreCliente).append("</strong>,</p>");
        html.append("<p style=\"font-size: 14px; color: #666; margin: 0 0 30px 0;\">");
        html.append("¡Excelentes noticias! Tu pedido <strong>#").append(pedidoId);
        html.append("</strong> ha sido entregado exitosamente.</p>");
        
        // Título de productos
        html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom: 20px;\">");
        html.append("<tr><td style=\"border-bottom: 3px solid #3b82f6; padding-bottom: 10px;\">");
        html.append("<h2 style=\"color: #333; font-size: 20px; margin: 0;\">&#x1F4E6; Detalle de tu pedido</h2>");
        html.append("</td></tr></table>");
        
        // ========== TABLA DE PRODUCTOS ==========
        html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 20px 0; border: 1px solid #e0e0e0;\">");
        
        // Header de la tabla
        html.append("<tr bgcolor=\"#f8f9fa\">");
        html.append("<td style=\"padding: 12px; font-size: 14px; font-weight: bold; color: #555; border-bottom: 2px solid #3b82f6;\">Producto</td>");
        html.append("<td style=\"padding: 12px; font-size: 14px; font-weight: bold; color: #555; text-align: center; border-bottom: 2px solid #3b82f6;\">Cantidad</td>");
        html.append("<td style=\"padding: 12px; font-size: 14px; font-weight: bold; color: #555; text-align: right; border-bottom: 2px solid #3b82f6;\">Subtotal</td>");
        html.append("</tr>");
        
        // Filas de productos
        for (ProductoEntregadoDTO producto : productos) {
            if (producto.getCantidad_kg() != null && producto.getCantidad_kg() > 0) {
                double precio = producto.getTipoProducto().equalsIgnoreCase("CORRIENTE") ? precioCorriente : precioEspecial;
                double subtotal = producto.getCantidad_kg() * precio;
                String badgeColor = producto.getTipoProducto().equalsIgnoreCase("CORRIENTE") ? "#2196F3" : "#FF9800";
                
                html.append("<tr style=\"border-bottom: 1px solid #eeeeee;\">");
                
                // Columna producto con badge
                html.append("<td style=\"padding: 15px 12px;\">");
                html.append("<span style=\"font-weight: 600; color: #333;\">").append(producto.getNombreProducto()).append("</span> ");
                html.append("<span style=\"background-color: ").append(badgeColor);
                html.append("; color: white; padding: 2px 8px; font-size: 11px; font-weight: bold;\">");
                html.append(producto.getTipoProducto()).append("</span>");
                html.append("</td>");
                
                // Columna cantidad
                html.append("<td style=\"padding: 15px 12px; text-align: center; color: #666;\">");
                html.append("<strong>").append(String.format("%.1f", producto.getCantidad_kg())).append("</strong> kg");
                html.append("</td>");
                
                // Columna subtotal
                html.append("<td style=\"padding: 15px 12px; text-align: right; color: #333; font-weight: 600;\">");
                html.append("$").append(String.format("%,d", (int)subtotal));
                html.append("</td>");
                
                html.append("</tr>");
            }
        }
        
        html.append("</table>");
        
        // ========== TOTAL ==========
        html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 30px 0;\">");
        html.append("<tr><td bgcolor=\"#3b82f6\" style=\"padding: 20px; text-align: right;\">");
        html.append("<p style=\"margin: 0; color: white; font-size: 14px;\">Total del pedido</p>");
        html.append("<p style=\"margin: 5px 0 0 0; color: white; font-size: 32px; font-weight: bold;\">$");
        html.append(String.format("%,d", (int)totalPedido)).append("</p>");
        html.append("</td></tr></table>");
        
        // ========== OBSERVACIONES ==========
        if (comentario != null && !comentario.trim().isEmpty()) {
            html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 20px 0;\">");
            html.append("<tr><td bgcolor=\"#fff8e1\" style=\"padding: 15px; border-left: 4px solid #ffc107;\">");
            html.append("<p style=\"margin: 0 0 5px 0; font-weight: bold; color: #f57c00; font-size: 14px;\">&#x1F4DD; Observaciones</p>");
            html.append("<p style=\"margin: 0; color: #666; font-size: 14px;\">").append(comentario).append("</p>");
            html.append("</td></tr></table>");
        }
        
        // ========== FECHA DE ENTREGA ==========
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 20px 0;\">");
        html.append("<tr><td bgcolor=\"#f8f9fa\" style=\"padding: 15px;\">");
        html.append("<p style=\"margin: 0; color: #666; font-size: 13px;\">");
        html.append("&#x1F4C5; <strong>Fecha de entrega:</strong> ").append(fechaEntrega.format(formatter));
        html.append("</p>");
        html.append("</td></tr></table>");
        
        // ========== MENSAJE DE AGRADECIMIENTO ==========
        html.append("<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 30px 0 20px 0;\">");
        html.append("<tr><td bgcolor=\"#f8f9fa\" style=\"padding: 20px; text-align: center;\">");
        html.append("<h3 style=\"margin: 0 0 10px 0; color: #3b82f6;\">&#x00A1;Gracias por tu compra! &#x1F389;</h3>");
        html.append("<p style=\"margin: 0; color: #666; font-size: 14px;\">Esperamos verte pronto.</p>");
        html.append("</td></tr></table>");
        
        html.append("</td></tr>"); // Fin contenido principal
        
        // ========== FOOTER ==========
        html.append("<tr><td bgcolor=\"#333333\" style=\"padding: 20px; text-align: center; color: #ffffff;\">");
        html.append("<p style=\"margin: 0; font-size: 12px;\">Equipo de Distribución</p>");
        html.append("<p style=\"margin: 5px 0 0 0; font-size: 11px; color: #cccccc;\">");
        html.append("Este es un correo automático, por favor no responder.</p>");
        html.append("</td></tr>");
        
        html.append("</table>"); // Fin tabla de contenido
        html.append("</td></tr></table>"); // Fin tabla contenedor
        html.append("</body></html>");
        
        return html.toString();
    }
}