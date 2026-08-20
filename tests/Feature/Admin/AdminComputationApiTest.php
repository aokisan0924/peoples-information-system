<?php

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\Computations;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminComputationApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');

        Schema::create('admins', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->string('branch')->nullable();
            $table->json('permissions')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('computations', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->unsignedSmallInteger('termMonths');
            $table->text('annualRateFormula');
            $table->text('monthlyRateFormula');
            $table->text('serviceFeeFormula');
            $table->text('insuranceFormula');
            $table->text('advanceInterestFormula');
            $table->text('effectiveRateFormula')->nullable();
            $table->boolean('isActive')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function test_set_active_deactivates_the_previous_computation_in_the_same_category(): void
    {
        $admin = Admin::create([
            'name' => 'Super Admin',
            'email' => 'super@example.test',
            'password' => 'password',
            'role' => 'super-admin',
            'branch' => 'Main Office',
            'permissions' => [],
        ]);

        $first = $this->computation('Old Rate', 12, true);
        $second = $this->computation('New Rate', 24, false);

        $this->actingAs($admin, 'admin')
            ->postJson(route('admin.computations.set-active', $second))
            ->assertOk()
            ->assertJsonPath('message', 'Computation activated');

        $this->assertFalse($first->refresh()->isActive);
        $this->assertTrue($second->refresh()->isActive);
    }

    private function computation(string $title, int $term, bool $active): Computations
    {
        return Computations::create([
            'title' => $title,
            'category' => 'ACTIVE_PENSIONER_V1',
            'termMonths' => $term,
            'annualRateFormula' => '0.09',
            'monthlyRateFormula' => 'annualInterestRate/12',
            'serviceFeeFormula' => 'netProceeds*0.121',
            'insuranceFormula' => '(netProceeds/1000)*terms',
            'advanceInterestFormula' => 'monthlyInterestRate*netProceeds*advanceInterestMonths',
            'isActive' => $active,
        ]);
    }
}
