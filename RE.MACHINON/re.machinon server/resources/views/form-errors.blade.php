@if ($errors->any())
    <div class="alert alert-dismissible alert-danger">
        <button type="button" class="close" data-dismiss="alert"><i class="fa fa-times" aria-hidden="true"></i></button>
        <p>{{ __('The form has some errors, please check:') }}</p>
        @foreach ($errors->all() as $error)
            <p><i class="fa fa-exclamation" aria-hidden="true"></i> {{ $error }}</p>
        @endforeach
    </div>
@endif