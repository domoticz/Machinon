@extends('layouts.app')

@section('title', __('Edit device'))

@section('content')
    <div class="row justify-content-center">
        <div class="col-8">
            <form id="devices-create-form" action="{{ route('devices.update', ['id' => $device->id]) }}" method="POST">
                @method('PATCH')
                @csrf
                @include('devices.form')
            </form>
        </div>
    </div>
@endsection