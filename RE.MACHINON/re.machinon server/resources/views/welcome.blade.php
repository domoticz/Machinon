@extends('layouts.app')

@section('title', 'Welcome!')

@section('content')

    <div class="d-flex justify-content-center align-items-center" style="height: 80vh;">
        <div class="text-center">
            <div class="display-3">
                Remachinon
            </div>
            <div class="text-muted">
                v0.1 alpha
            </div>
        </div>
    </div>
@endsection

{{--@if (Route::has('login'))--}}
{{--<div class="top-right links">--}}
{{--@auth--}}
{{--<a href="{{ url('/devices') }}">My devices</a>--}}
{{--@else--}}
{{--<a href="{{ route('login') }}">Login</a>--}}
{{--<a href="{{ route('register') }}">Register</a>--}}
{{--@endauth--}}
{{--</div>--}}
{{--@endif--}}