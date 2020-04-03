<?php

use Illuminate\Database\Seeder;

use Remachinon\Models\Device;
use Remachinon\Models\DeviceTunnel;
use Remachinon\Models\User;

class ProductionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Generates a default user
        User::create([
            'name' => 'Machinon Admin',
            'email' => 'admin@machinon.com',
            'password' => bcrypt('secret'),
        ]);
    }
}
