<?php

use Illuminate\Database\Seeder;

use Remachinon\Models\Device;
use Remachinon\Models\DeviceTunnel;
use Remachinon\Models\User;

class DevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Generates a default user with 4 devices and it's respective Tunnel records
        User::create([
            'name' => 'Jose Garcia',
            'email' => 'test@machinon.com',
            'password' => bcrypt('secret'),
        ])->each(function($user) {
            factory(Device::class, 4)->create(['user_id' => $user->id])->each(function($device) {
                factory(DeviceTunnel::class)->create(['device_id' => $device->id]);
            });
        });

        // Generates 10 dummy ysers witg 2 devices each and it's respective Tunnel records
        factory(User::class, 10)->create()->each(function($user) {
            factory(Device::class, 2)->create(['user_id' => $user->id])->each(function($device) {
                factory(DeviceTunnel::class)->create(['device_id' => $device->id]);
            });
        });
    }
}
