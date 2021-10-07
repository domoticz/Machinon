@extends('layouts.app')

@section('title', __('Create device'))

@section('content')
    <div class="row justify-content-center">
        <div class="col-8">
            <form id="devices-create-form" action="{{ route('devices.store') }}" method="POST">
                @csrf
                @include('devices.form')
            </form>
        </div>
    </div>
@endsection