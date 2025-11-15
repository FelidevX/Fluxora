# 🚀 Guía de Configuración para Deploy en Render

## 📋 Variables de Entorno para Configurar en Render

### 🌐 **API Gateway**

En tu servicio de Gateway en Render, configura estas variables:

```env
EUREKA_URL=https://fluxora-e3su.onrender.com/eureka/
EUREKA_INSTANCE_HOSTNAME=tu-gateway.onrender.com
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=https://tu-frontend.onrender.com
DB_URL=jdbc:postgresql://db.cumaxuklkptfymxrxouw.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=Flux0ra2025!
JWT_SECRET=fZrA95JoifClyMPReL6N+ewR1rwa7wsLmH8nbK0awzw=
JWT_EXP=60
```

**IMPORTANTE:**

- Reemplaza `tu-gateway.onrender.com` con la URL real de tu Gateway
- Reemplaza `tu-frontend.onrender.com` con la URL real de tu Frontend
- Si quieres permitir múltiples orígenes: `CORS_ALLOWED_ORIGINS=https://frontend1.onrender.com,https://frontend2.onrender.com`

---

### 🎨 **Frontend Next.js**

En tu servicio de Frontend en Render, configura:

```env
NEXT_PUBLIC_API_URL=https://tu-gateway.onrender.com
```

**IMPORTANTE:**

- Esta URL debe apuntar a tu API Gateway en Render
- **NO** incluyas `/api` al final, el código ya lo maneja

---

### 🔧 **Microservicios (Cliente, Usuario, Entrega, Inventario)**

Cada microservicio necesita:

```env
SERVER_PORT=808X  # 8081, 8082, 8083, 8084 según el servicio
EUREKA_URL=https://fluxora-e3su.onrender.com/eureka/
EUREKA_INSTANCE_HOSTNAME=tu-servicio.onrender.com
DB_URL=jdbc:postgresql://db.cumaxuklkptfymxrxouw.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=Flux0ra2025!
JWT_SECRET=fZrA95JoifClyMPReL6N+ewR1rwa7wsLmH8nbK0awzw=
JWT_EXP=60
```

**Para el servicio de Entrega, agregar también:**

```env
SMTP_PASSWORD=xvdn gyjy hnfx vepn
```

---

## 🔄 Proceso de Deploy

### 1️⃣ **Orden de Deploy**

Deploya los servicios en este orden:

1. ✅ **Eureka Server** (ya está funcionando en `https://fluxora-e3su.onrender.com`)
2. **API Gateway**
3. **Microservicios** (en cualquier orden):
   - microservice-usuario
   - microservice-inventario
   - microservice-cliente
   - microservice-entrega
4. **Frontend**

---

### 2️⃣ **Verificar el Registro en Eureka**

Después de desplegar cada servicio:

1. Ve a: `https://fluxora-e3su.onrender.com/`
2. Espera 30-60 segundos
3. El servicio debería aparecer en **"Instances currently registered with Eureka"**

---

### 3️⃣ **Configurar CORS Después del Deploy del Frontend**

Una vez que tengas la URL del frontend:

1. **En Render** → Gateway → Environment
2. Actualiza `CORS_ALLOWED_ORIGINS` con la URL real
3. **Manual Deploy** → Deploy latest commit

---

## 🛠️ Desarrollo Local vs Producción

### **Desarrollo Local:**

#### Frontend:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Gateway:

```env
# .env
CORS_ALLOWED_ORIGINS=http://localhost:3000
EUREKA_URL=http://eureka-server:8761/eureka/
```

### **Producción (Render):**

#### Frontend:

```env
# Variables de entorno en Render
NEXT_PUBLIC_API_URL=https://tu-gateway.onrender.com
```

#### Gateway:

```env
# Variables de entorno en Render
CORS_ALLOWED_ORIGINS=https://tu-frontend.onrender.com
EUREKA_URL=https://fluxora-e3su.onrender.com/eureka/
```

---

## ✅ Checklist de Deploy

### **Antes de Deployar:**

- [ ] Todos los servicios tienen las variables de entorno configuradas
- [ ] Las URLs de Eureka apuntan a producción
- [ ] La base de datos de Supabase está configurada
- [ ] Los secrets de JWT son los mismos en todos los servicios

### **Después de Deployar:**

- [ ] Eureka muestra todos los servicios registrados
- [ ] Gateway responde correctamente
- [ ] Frontend puede conectarse al Gateway
- [ ] CORS está configurado con la URL correcta del frontend
- [ ] Las APIs responden a través del Gateway

---

## 🐛 Troubleshooting

### **Problema: Gateway no se registra en Eureka**

**Solución:**

1. Verifica que `EUREKA_URL` sea correcta
2. Verifica que `EUREKA_INSTANCE_HOSTNAME` sea tu URL de Gateway
3. Revisa los logs en Render

### **Problema: CORS Errors en el Frontend**

**Solución:**

1. Verifica que `CORS_ALLOWED_ORIGINS` incluya tu URL de frontend
2. Asegúrate de usar HTTPS (no HTTP) en producción
3. Re-deploya el Gateway después de cambiar CORS

### **Problema: Frontend no puede conectarse al API**

**Solución:**

1. Verifica que `NEXT_PUBLIC_API_URL` apunte a tu Gateway
2. Verifica que el Gateway esté funcionando
3. Revisa la consola del navegador para errores

---

## 📝 Ejemplo de URLs Completas

```
Eureka:     https://fluxora-e3su.onrender.com
Gateway:    https://fluxora-gateway.onrender.com
Frontend:   https://fluxora-frontend.onrender.com
Usuario:    https://fluxora-usuario.onrender.com
Inventario: https://fluxora-inventario.onrender.com
Cliente:    https://fluxora-cliente.onrender.com
Entrega:    https://fluxora-entrega.onrender.com
```

---

## 🔐 Seguridad

**IMPORTANTE: NO subas archivos `.env` a Git**

Asegúrate de tener esto en tu `.gitignore`:

```gitignore
.env
.env.local
.env.production
**/.env
!.env.example
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que los servicios estén en el orden correcto
