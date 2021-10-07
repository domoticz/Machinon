@extends('layouts.app')

@section('title', __('Your devices'))

@section('content')
    <div class="row justify-content-center">
        <div class="col-8">
            <div class="row">
                @foreach($devices->all() as $device)
                    <div class="col-lg-4 col-sm-6 col-xs-12 justify-content-center px-1 pb-2">
                        @include('devices.card')
                    </div>
                    @if($loop->iteration % 3 == 0)
                        {{--<div class="w-100"></div>--}}
                        {!! '</div><div class="row">' !!}
                    @endif
                @endforeach
            </div>
        </div>
    </div>
    <div class="row justify-content-center">
        <div class="col col-md-4">
            <a href="{{ route('devices.create') }}"
               class="btn btn-primary btn-lg btn-block border border-dark">{{ __('Add device') }}</a>
        </div>
    </div>
@endsection

@section('javascript')
    <script type="text/javascript">
        let target;
        let progbar = 0;
        $(document).ready(function() {
            // If page is refreshed, this scans all devices already connected and actives link buttons
            $('input:checked.tunnelswitch').each(function() {
                target = $(this);
                target.prop('disabled', true);
                $('#statusM'+target.data('id')).html('Sending request...');
                goM = $('#goM'+target.data('id'));
                goM.removeClass('btn-danger btn-success')
                    .addClass('btn-warning')
                    .find('i')
                    .removeClass('fa-exclamation-triangle fa-handshake')
                    .addClass('fa-spinner fa-spin');
                status_tunnel(target, 1);
            });
            // If a switch is changed, connect or disconnect tunnel
            $('input.tunnelswitch').change(function(e) {
                target = $(e.currentTarget);
                target.prop('disabled', true);
                statusM = $('#statusM'+target.data('id'));
                goM = $('#goM'+target.data('id'));
                goM.removeClass('btn-danger btn-success')
                    .addClass('btn-warning')
                    .find('i')
                    .removeClass('fa-exclamation-triangle fa-handshake')
                    .addClass('fa-spinner fa-spin');
                if (target.prop('checked')) {
                    connect_tunnel(target);
                } else {
                    disconnect_tunnel(target, 1);
                }
            });
        });

        let connect_tunnel = (target) =>
        {
            statusM = $('#statusM'+target.data('id'));
            goM = $('#goM'+target.data('id'));
            statusM.html('Sending request...');
            $.ajax({
                url: target.data('connect-url'),
                method: "GET",
                dataType: "json",
                success: function (result) {
                    status_tunnel(target, 1);
                },
                error: function (req, status, error) {
                    statusM.html('Unable to connect!');
                    goM.removeClass('btn-success btn-danger')
                        .addClass('btn-warning')
                        .find('i')
                        .removeClass('fa-handshake fa-spinner fa-spin')
                        .addClass('fa-exclamation-triangle');
                    setTimeout(function() {
                        target.prop('disabled', false);
                        target.bootstrapToggle('off');
                    },3000);
                }
            });
        };

        let status_tunnel = (target, retries) =>
        {
            statusM = $('#statusM'+target.data('id'));
            goM = $('#goM'+target.data('id'));
            statusM.html('Awaiting handshake...');
            $.ajax({
                url: target.data('status-url'),
                method: "GET",
                dataType: "json",
                success: function (result) {
                    statusM.html('Ready! Click the handshake button to proceed.');
                    goM.removeClass('btn-danger btn-warning')
                        .addClass('btn-success')
                        .prop('disabled', false)
                        .find('i')
                        .removeClass('fa-exclamation-triangle fa-spinner fa-spin')
                        .addClass('fa-handshake');
                    run_tunnel(target, result);
                },
                error: function (req, status, error) {
                    if (req.status === 408 || retries > 6) {
                        statusM.html('Unable to connect!');
                        goM.removeClass('btn-success btn-danger')
                            .addClass('btn-warning')
                            .find('i')
                            .removeClass('fa-handshake fa-spinner fa-spin')
                            .addClass('fa-exclamation-triangle');
                        setTimeout(function() {
                            target.prop('disabled', false);
                            target.bootstrapToggle('off');
                        },3000);
                     } else {
                        retries++;
                        setTimeout(function () {
                            status_tunnel(target, retries);
                        }, 5000);
                    }
                }
            });
        };

        let run_tunnel = (target, result) =>
        {
            target.prop('disabled', false);
            goM = $('#goM'+target.data('id'));
            $('#machToken'+target.data('id')).attr('value', result.response_body.access_token);
            $('#machUUID'+target.data('id')).attr('value', result.response_body.tunnel_uuid);
            $('#machAction'+target.data('id')).attr({
                action: '{{ Request::getSchemeAndHttpHost() }}/remote/' + result.response_body.tunnel_uuid + '/auth.php'
            });
        };

        let disconnect_tunnel = (target, retries) =>
        {
            $('#statusM'+target.data('id')).html('Disconecting...');
            $('#machToken'+target.data('id')).attr('value', '');
            $('#machUUID'+target.data('id')).attr('value', '');
            $('#machAction'+target.data('id')).attr('action', '');
            $.ajax({
                url: target.data('disconnect-url'),
                method: "GET",
                dataType: "json",
                success: function (result) {
                    target.prop('disabled', false);
                    $('#statusM'+target.data('id')).html('Disconnected');
                    $('#goM'+target.data('id')).attr('disabled', true);
                    goM.removeClass('btn-success btn-warning')
                        .addClass('btn-danger')
                        .attr('disabled', true)
                        .find('i')
                        .removeClass('fa-spinner fa-spin')
                        .addClass('fa-handshake');
                    setTimeout(function() {
                        $('#statusM'+target.data('id')).html('');
                    }, 5000);
                },
                error: function (req, status, error) {
                    if (retries > 3) {
                        target.prop('disabled', false);
                        goM.removeClass('btn-success btn-warning')
                            .addClass('btn-danger')
                            .attr('disabled', true)
                            .find('i')
                            .removeClass('fa-spinner fa-spin')
                            .addClass('fa-handshake');
                    } else {
                        retries++;
                        setTimeout(function () {
                            disconnect_tunnel(target, retries);
                        }, 1000);
                    }
                }
            });
        };

    </script>
@endsection