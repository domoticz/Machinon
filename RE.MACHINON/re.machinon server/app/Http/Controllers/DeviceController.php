<?php

namespace Remachinon\Http\Controllers;

use Remachinon\Models\Device;
use Illuminate\Support\Facades\Auth;

class DeviceController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        if (Auth::user()->hasRole('admin')) {
            $devices = Device::all();
        } else {
            $devices = auth()->user()->devices;
        }

        $token = Auth::user()->token();

        return view('devices.index', compact('devices', 'token'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $device = new Device();
        return view('devices.create', compact('device','token'));
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return \Illuminate\Http\Response
     */
    public function store()
    {
        $attributes = request()->validate([
            'name' => ['required'],
            'muid' => ['bail','required','regex:/^[a-f0-9]{12,19}$/i',
                'max:19','unique:devices'],
            'description' => ['max:256']
        ]);
        $device = auth()->user()->devices()->create($attributes);
        // Creates the new Device's DeviceTunnel model automatically
        $device->device_tunnel()->create();
        return redirect()->route('devices.index')
            ->with('success', __('Device created successfully!'));
    }

    /**
     * Display the specified resource.
     *
     * @param  \Remachinon\Models\Device  $device
     * @return \Illuminate\Http\Response
     */
    public function show(Device $device)
    {
        $this->authorize('update', $device);
        return view('devices.show', compact('device'));
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \Remachinon\Models\Device  $device
     * @return \Illuminate\Http\Response
     */
    public function edit(Device $device)
    {
        $this->authorize('update', $device);
        return view('devices.edit', compact('device'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Remachinon\Models\Device  $device
     * @return \Illuminate\Http\Response
     */
    public function update(Device $device)
    {
        $this->authorize('update', $device);
        $attributes = request()->validate([
            'name' => ['required'],
            'muid' => ['bail','required','regex:/^[a-f0-9]{12,19}$/i',
                       'max:19','unique:devices,muid,' . $device->id],
            'description' => ['max:256']
        ]);
        $device->update($attributes);
        return redirect()->route('devices.index')
            ->with('success', __('Device updated successfully!'));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \Remachinon\Models\Device  $device
     * @return \Illuminate\Http\Response
     */
    public function destroy(Device $device)
    {
        $this->authorize('update', $device);
        return redirect()->route('devices.index');
    }

    /**
     *
     */
    public function getkey()
    {
        $path = storage_path('remachinon-private.key');
        return response()->download($path, 'remachinon_rsa_key.pem');
    }
}
