<?php
// Configuración base para Hostinger (PHP 8.x + MySQL).
// Copia este archivo, rellena tus credenciales y súbelo fuera de public_html si tu hosting lo permite.

return [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'tu_base_de_datos',
    'db_user' => getenv('DB_USER') ?: 'tu_usuario',
    'db_pass' => getenv('DB_PASS') ?: 'tu_password_segura',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'app_url' => getenv('APP_URL') ?: 'https://tu-dominio.com'
];
