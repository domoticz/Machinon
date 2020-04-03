@extends('layouts.app')

@section('title', __('Device information'))

@section('content')
    <div class="row justify-content-center">
        <div class="col-8">
            <div class="card border-primary mb-3">
                <div class="card-header"><h4>@yield('title')</h4></div>
                <div class="card-body">
                    <div class="row">
                        <div class="col">
                            <div class="form-group">
                                <label for="name">{{ __('Device name') }}</label>
                                <h3>{{ $device->name }}</h3>
                            </div>
                            <div class="form-group">
                                <label for="muid">{{ __('Machinon Unique Identifier (MUID)') }}</label>
                                <h3>{{ $device->muid }}</h3>
                            </div>

                        </div>
                        <div class="col text-right">
                            <div class="form-group">
                                <label for="online">{{ __('Device status') }}</label>
                                @if ($device->is_enabled)
                                    <p><button type="button" class="btn btn-success">{{ __('Online') }}</button></p>
                                @else
                                    <p><button type="button" class="btn btn-danger">{{ __('Offline') }}</button></p>
                                @endif
                            </div>
                            <div class="form-group">
                                <label for="status">{{ __('Remote link status') }}</label>
                                @if ($device->device_tunnel->is_enabled)
                                    <p><button type="button" class="btn btn-success">{{ __('Connected') }}</button></p>
                                @else
                                    <p><button type="button" class="btn btn-danger">{{ __('Disonnected') }}</button></p>
                                @endif
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="form-group">
                                <label for="description">{{ __('Description') }}</label>
                                <h3>{{ $device->description }}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-muted">
                    <a href="{{ url()->previous() }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> {{ __('Back') }}</a>
                    <a href="{{ url()->route('devices.edit', ['id' => $device->id]) }}" class="btn btn-primary float-right">
                        <i class="fas fa-pen"></i> {{ __('Edit') }}</a>
                </div>
            </div>
        </div>
    </div>
@endsection