<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }} :: @yield('title')</title>
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- Fonts -->
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css">
    <!-- Styles -->
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link href="https://gitcdn.github.io/bootstrap-toggle/2.2.0/css/bootstrap-toggle.min.css" rel="stylesheet">
    <!-- Icons -->
    <link rel="shortcut icon" href="favicon.ico">
    <link rel="apple-touch-icon" href="images/iphone-icon.png">
    <link rel="icon" sizes="192x192" href="images/logo192.png">
</head>
<body style="">
    <div id="app">
        @include('navbar')
        <main role="main" class="py-4" class="container">
            <div class="row m-auto justify-content-center">
                <div class="col">
                    @yield('content')
                </div>
            </div>
        </main>
        <div class="row m-auto justify-content-center">
            @include('flash-message')
        </div>
    </div>
    @yield('modalboxes')
    <!-- Scripts -->
    {{-- For some reason using the npm compiled asset makes jquery not behave --}}
    {{-- Scripts using $ fail, but after page completes loading $ works on console --}}
    {{-- I've tried placing at header defer and bottom, also ensured my scripts are loaded AFTER jquery...--}}
    {{--<script src="{{ asset('js/app.js') }}" defer></script>--}}
    {{-- ...Nothing works, but if I load que JS libraries directly as follows it works. Probably something related to VUE ¿? --}}
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"
            integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
            integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
            integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
    <script src="https://gitcdn.github.io/bootstrap-toggle/2.2.0/js/bootstrap-toggle.min.js"></script>
    @yield('javascript')
</body>
</html>