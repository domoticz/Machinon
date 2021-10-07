<?php

namespace Remachinon\Http\Controllers;

class HomeController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        if (\Auth::guest()) {
            return view('auth.login');
        } else {
            return redirect()->route('devices.index');
        }
    }
}
