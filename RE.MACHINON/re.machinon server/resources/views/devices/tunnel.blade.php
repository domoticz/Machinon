@extends('layouts.app')

@section('title', __('Connecting to '.$device_tunnel->device->name))

@section('content')
    <div class="row">
        <div class="col align-content-center">
            <div class="card border-primary mb-auto mt-auto">
                <div class="card-body">
                    <div class="card-text text-center">
                        <h3>{{ __('Please wait') }}<br/>
                            {{ __('connecting to') }}</h3>
                        <h2>{{ $device_tunnel->device->name }}</h2>
                        <h1><i class="fas fa-cog fa-spin"></i></h1>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection