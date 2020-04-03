<div class="card border-primary mb-3">
    <div class="card-header"><h4>@yield('title')</h4></div>
    <div class="card-body">
        {{--<h4 class="card-title">Primary card title</h4>--}}
        {{--<p class="card-text"></p>--}}
        <div class="form-group row">
            <label for="name" class="col-sm-4 col-form-label text-md-right">{{ __('Device name') }}</label>
            <div class="col-md-6">
                <input type="text" name="name" class="form-control"
                       value="{{ old('name', $device->name) }}" required />
            </div>
        </div>
        <div class="form-group row">
            <label for="muid" class="col-sm-4 col-form-label text-md-right">{{ __('Machinon Unique Identifier') }}<br/>
                <span class="badge badge-light d-inline-block" role="button" style="cursor:pointer"
                      data-container="body" data-toggle="popover" data-placement="right"
                      data-content="{{ __('image with location of MUID here...') }}"
                      data-original-title="{{ __('Finding the MUID') }} Title">{{ __('Where do I find this?') }}</span></label>
            <div class="col-md-6"><input type="text" name="muid" class="form-control"
                 value="{{ old('muid', $device->muid) }}" required />
            </div>
        </div>
        <div class="form-group row">
            <label for="description" class="col-sm-4 col-form-label text-md-right">{{ __('Description') }}</label>
            <div class="col-md-6">
                <textarea name="description"
                          class="md-textarea form-control">{{ old('description', $device->description) }}</textarea>
            </div>
        </div>
        <div class="form-group row mb-0">
            <div class="col-md-12">
                @include('form-errors')
                <a href="{{ route('devices.index') }}" class="btn btn-secondary">
                    <i class="fas fa-arrow-left"></i> {{ __('Back') }}</a>
                <button type="submit" class="btn btn-success float-right">
                    <i class="fas fa-check"></i> {{ __('Save') }}</button>
            </div>
        </div>
    </div>
</div>

@section('javascript')
    <script type="text/javascript">
        // Initialize Popovers
        $(function () {
        $('[data-toggle="popover"]').popover()
        });
    </script>
@endsection
