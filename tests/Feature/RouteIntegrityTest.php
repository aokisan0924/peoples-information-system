<?php

namespace Tests\Feature;

use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use ReflectionMethod;
use Tests\TestCase;

class RouteIntegrityTest extends TestCase
{
    public function test_every_controller_route_points_to_a_callable_public_method(): void
    {
        $invalid = [];

        foreach (RouteFacade::getRoutes() as $route) {
            $action = $route->getActionName();

            if ($action === 'Closure' || ! str_contains($action, '@')) {
                continue;
            }

            [$controller, $method] = explode('@', $action, 2);

            if (! class_exists($controller) || ! method_exists($controller, $method)) {
                $invalid[] = "{$route->methods()[0]} {$route->uri()} -> {$action}";

                continue;
            }

            if (! (new ReflectionMethod($controller, $method))->isPublic()) {
                $invalid[] = "{$route->methods()[0]} {$route->uri()} -> {$action} is not public";
            }
        }

        $this->assertSame([], $invalid, implode(PHP_EOL, $invalid));
    }

    public function test_route_names_and_http_method_uri_pairs_are_unique(): void
    {
        $names = [];
        $signatures = [];
        $duplicates = [];

        /** @var Route $route */
        foreach (RouteFacade::getRoutes() as $route) {
            if ($route->getName()) {
                if (isset($names[$route->getName()])) {
                    $duplicates[] = "duplicate name: {$route->getName()}";
                }
                $names[$route->getName()] = true;
            }

            foreach ($route->methods() as $method) {
                $signature = "{$method} {$route->uri()}";
                if (isset($signatures[$signature])) {
                    $duplicates[] = "duplicate route: {$signature}";
                }
                $signatures[$signature] = true;
            }
        }

        $this->assertSame([], $duplicates, implode(PHP_EOL, $duplicates));
    }

    public function test_literal_frontend_route_calls_reference_registered_names(): void
    {
        $registered = collect(RouteFacade::getRoutes()->getRoutes())
            ->map(fn (Route $route) => $route->getName())
            ->filter()
            ->flip();
        $invalid = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(resource_path('js'), \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (! in_array($file->getExtension(), ['js', 'jsx', 'ts', 'tsx'], true)) {
                continue;
            }

            $normalizedPath = str_replace('\\', '/', $file->getPathname());
            $unusedScaffold = str_contains($normalizedPath, '/Pages/Auth/')
                || str_contains($normalizedPath, '/Pages/Profile/')
                || str_ends_with($normalizedPath, '/Layouts/AuthenticatedLayout.jsx')
                || str_ends_with($normalizedPath, '/Pages/Client/ClientChangePassword.jsx');

            if ($unusedScaffold) {
                continue;
            }

            $contents = file_get_contents($file->getPathname());
            preg_match_all('/\broute\(\s*[\'\"]([A-Za-z0-9_.-]+)[\'\"]/', $contents, $matches);

            foreach (array_unique($matches[1]) as $name) {
                if (! $registered->has($name)) {
                    $invalid[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname()).": {$name}";
                }
            }
        }

        sort($invalid);
        $this->assertSame([], $invalid, implode(PHP_EOL, $invalid));
    }

    public function test_literal_frontend_axios_urls_match_registered_http_routes(): void
    {
        $registered = [];
        foreach (RouteFacade::getRoutes() as $route) {
            foreach ($route->methods() as $method) {
                $registered[strtoupper($method).' /'.ltrim($route->uri(), '/')] = true;
            }
        }

        $invalid = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(resource_path('js'), \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (! in_array($file->getExtension(), ['js', 'jsx', 'ts', 'tsx'], true)) {
                continue;
            }

            $contents = file_get_contents($file->getPathname());
            preg_match_all('/\b(?:window\.)?axios\.(get|post|put|patch|delete)\(\s*[\'\"](\/[A-Za-z0-9_\/-]+)[\'\"]/', $contents, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                $signature = strtoupper($match[1]).' '.$match[2];
                if (! isset($registered[$signature])) {
                    $invalid[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname()).": {$signature}";
                }
            }
        }

        sort($invalid);
        $this->assertSame([], $invalid, implode(PHP_EOL, $invalid));
    }
}
