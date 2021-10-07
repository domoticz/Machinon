<?php

/**
 * TO GENERATE SOME DUMMY USERS/DEVICES RUN
 * $ php artisan migrate:fresh --seed
 * ONLY FOR DEVELOPMENT SERVERS, DO NOT RUN ON PRODUCTION!!
 */

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        if (app()->isLocal()) {
            $this->call([
                DevelSeeder::class,
            ]);
        } else {
            $this->call([
                ProductionSeeder::class,
            ]);
        }
    }
}
