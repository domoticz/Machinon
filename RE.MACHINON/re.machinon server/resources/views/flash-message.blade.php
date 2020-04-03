@if ($message = Session::get('success'))
    <div class="alert alert-dismissible alert-success" role="alert">
        <button type="button" class="close" data-dismiss="alert"><i class="fa fa-times" aria-hidden="true"></i></button>
        <strong>{{ $message }}</strong>
    </div>
@endif
@if ($message = Session::get('error'))
    <div class="sticky-top alert alert-dismissible alert-danger" role="alert">
        <button type="button" class="close" data-dismiss="alert"><i class="fa fa-times" aria-hidden="true"></i></button>
        <strong>{{ $message }}</strong>
    </div>
@endif
@if ($message = Session::get('warning'))
    <div class="alert alert-dismissible alert-warning" role="alert">
        <button type="button" class="close" data-dismiss="alert"><i class="fa fa-times" aria-hidden="true"></i></button>
        <strong>{{ $message }}</strong>
    </div>
@endif
@if ($message = Session::get('info'))
    <div class="alert alert-dismissible alert-info" role="alert">
        <button type="button" class="close" data-dismiss="alert"><i class="fa fa-times" aria-hidden="true"></i></button>
        <strong>{{ $message }}</strong>
    </div>
@endif
