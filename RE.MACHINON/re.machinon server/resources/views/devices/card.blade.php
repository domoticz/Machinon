<div class="card text-white bg-primary border-dark rounded" style="width:100%;height:100%">
    <div class="card-header">
        <div class="float-right align-self-center">
            <a href="{{ route('devices.edit', ['id' => $device->id]) }}"
               class="btn btn-primary float-left border border-dark">
                <i class="fas fa-pencil-alt"></i></a>
            {{-- <img src="{{ asset('images/machinon_icon.png') }}"
                 class="card-icon" alt="icon" /> --}}</div>
        <h4>{{ $device->name }}</h4>
        {{--<small class="card-subtitle mb-2 text-secondary">{{ $device->muid }}</small>--}}
    </div>
    <div class="card-body bg-light text-dark">
        <p class="card-text">{{ $device->description }}</p>
    </div>
    <div class="card-footer">
        <div class="row">
            <div class="col text-left">
                <p class="small m-0">{{ __('Remote link') }}<br/>
                <span class="small" id="statusM{{ $loop->iteration }}"></span></p>
            </div>
            <div class="col text-right">
                {{--<a href="{{ route('devices.show', ['id' => $device->id]) }}"
       class="btn btn-primary border border-dark">
        <i class="far fa-eye"></i></a>--}}
                {{--<a href="{{ route('devices.connect', ['id' => $device->device_tunnel->id]) }}"--}}
                {{--class="btn btn-success float-right border border-dark" target="_blank">--}}
                {{--<i class="far fa-handshake"></i></a>--}}
                <form id="machAction{{ $loop->iteration }}" action="" method="post" target="_blank">
                    <input id="machUUID{{ $loop->iteration }}" type="hidden" name="tunnel_uuid" value="" />
                    <input id="machToken{{ $loop->iteration }}" type="hidden" name="access_token" value="" />
                    <button id="goM{{ $loop->iteration }}" type="submit" disabled
                            class="btn float-right border border-dark btn-danger">
                        <i class="fas fa-handshake"></i></button>
                </form>

                <label class="checkbox-inline float-right">
                    <input type="checkbox"
                           data-id="{{ $loop->iteration }}"
                           data-connect-url="{{ route('devices.connect', ['id' => $device->device_tunnel->id]) }}"
                           data-disconnect-url="{{ route('devices.disconnect', ['id' => $device->device_tunnel->id]) }}"
                           data-status-url="{{ route('tunnels.status', ['id' => $device->device_tunnel->id]) }}"
                           data-toggle="toggle"
                           data-on="<i class='fas fa-play'></i>" data-onstyle="success"
                           data-off="<i class='fas fa-square'></i>" data-offstyle="danger"
                           data-width="50"
                           class="tunnelswitch border border-dark"
                           style="display:none"
                           @if ($device->device_tunnel->is_enabled)
                               checked
                           @endif
                    />
                </label>
            </div>
        </div>
    </div>
</div>