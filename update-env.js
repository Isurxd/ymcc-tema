const fs = require('fs');
const envPath = '.env.local';

const serviceAccount = {
  "type": "service_account",
  "project_id": "ymcc-vii",
  "private_key_id": "7aa6a32f7474c1b63ba71e11538f1bb907419392",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDBlBzK9G0g1Rx3\nsblBfWe7XHYGh6TfAUwjqXm6ycYraEmchVGSCzXHAMQLEh6Vgvy80Lmmk3oc/E7g\nFWiz2Ixd0NW/GrHkNUQXSeK3GHDN/F3VE+02YD9UbTVu5FxxJ0qNk1rNQwJEZVdB\n6f0nWrIzHcOGKiZhBXZ4WrKS6fboinzm4v0HrLSt4ojIwADgAKXMtTms45hNT8n0\naPMeS+VP4cDqTQjnAoS0K2Y7vRbqyaUp/TJCOhPnIO4CyVOn5QA5yOClfK7OhBqz\nn3KdLAtYvEsSZ/h+mQtSIWhS3Gzelx7Bw7mi9m3Q4hdc6mPTFTO6OB78VB1yJNyM\nQjYHvK8lAgMBAAECggEAGfuD29fv99qy7fvsVjZ7YGIaM2ksf4RAkH7UaHZhw3zF\neJ1KZBReHP5k0emWMlI5Eyze5lVgLBjPi3NEMPONb6AyuGpgWzWtFIUlyZaduYA4\npft9OPG1PmNEK0S6hbOU5ajUJL3sRXrmueGqyYf6aDMEBfONYDNoAeKGmoKN0gtc\n0M3xGKTQJpZVlXqPtKSvtszcOuDDjBHQyrlIZuVUa3cs9vNRthf+I/7IN7ENL+SH\nk5nRcd3c8QDYiMVETxulfyJt7/OCZpnFKaGOjLC8Y9US+F7uNfC2+JhJDJG3teQ6\nLPSEwM+loRTJbxfFP8Vgx6s+wT5bUEVJXImDSuHIpwKBgQDiXZfJ9stNvfhXcdbC\npBlvoCIlrA95jvJVDuo3jcN65qIun+nBiScY2DGpm7XDpBVI/lAX3Izuahg8lgd+\npXSDXP62uTTalvDZIO7ZIEXDEFjHMafmbItICZryOH8ugpZPGTgb5O7Cho86jvEr\n4kIU9rcbw82LCyXajomHWLtDxwKBgQDa67JBF0Gt2Sg4PgJ78JqH3XyCHr8CJ7/I\njOeodB9CW4YTAddzgMnoy+2B8NLmlH057YB1ZS/sjaSjO+ZeMA8Qax4X3kxjSB1x\nDnxEniuAEfuRG0r1tsLtqXy8ptHR65x2vrc/0amY2OYxgsgCxO83ljSIkZcwD7NH\nfjKvV2tdswKBgDq33G/fPM1lwc2tEfBbcN2rxC/RehImKmY2ADt44oQ230sI4DH7\nydCABCHi6jtdjMfqcAxAga42hyLwJ/GKKbcJoGj1kehBzygDivF3laEL1HuXPd5f\nuaFuHGtIjHUcGrFZ8VwK/oQnM3AVNCoV/t5BQS5KlD7FHYScBMC/G5RxAoGAaisa\nFJUZxhzlc3knLUI/Pxq78kLE8V+jk7g59Kj0K/NE71zaRuqzgNG9SmIndamXnYs/\n3C8JcdgzevJmw1DdTWIVgw/Mze1AUf7rZz+p6v9NmE67KLTMjgO/OaJRaVOxWqkd\nJ7cfX7/4yxQYubcWKEgRDBZHUwiaMlbSb9Sefh8CgYAv8qhSFdWQzRUhH+x0xRMh\nlofEF9GpDcRZsjSWh8/4ihhwfO+gMAP2zw27MoSTFMoIWHARfcR2zFfSSR3AMdqO\nm36xSHf+TRskf3nDd8CHTpDooOJDDXLKUYOmrOmZywU8SY/sJeXP+o+ocDXRHUd5\nJB/o3whu+XlsZaP8k+8AlA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@ymcc-vii.iam.gserviceaccount.com",
  "client_id": "101462888185993273676",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ymcc-vii.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

let content = fs.readFileSync(envPath, 'utf8');
const newKey = `FIREBASE_SERVICE_ACCOUNT_KEY='${JSON.stringify(serviceAccount)}'`;
content = content.replace(/^FIREBASE_SERVICE_ACCOUNT_KEY=.*$/m, newKey);
fs.writeFileSync(envPath, content);
console.log('Updated .env.local with new service account key.');
