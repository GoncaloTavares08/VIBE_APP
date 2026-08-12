<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$routes = Route::getRoutes();
$errors = [];

foreach ($routes as $route) {
    $action = $route->getAction();
    if (isset($action['controller'])) {
        [$class, $method] = explode('@', $action['controller']);
        if (!class_exists($class)) {
            $errors[] = "Class does not exist: $class (Route: " . $route->uri() . ")";
        } elseif (!method_exists($class, $method)) {
            $errors[] = "Method does not exist: $class::$method (Route: " . $route->uri() . ")";
        }
    }
}

if (empty($errors)) {
    echo "All routes are valid!\n";
} else {
    echo implode("\n", $errors) . "\n";
}
