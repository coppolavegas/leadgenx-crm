'use client';

import { WizardData } from '@/app/campaigns/new/page';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MapPin } from 'lucide-react';

interface Props {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
}

export function WizardStep2({ data, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Location & Radius</h2>
        <p className="text-muted-foreground">
          Define the geographic area where you want to find leads
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Country */}
        <div>
          <Label htmlFor="country">Country *</Label>
          <select
            id="country"
            value={data.geo_country}
            onChange={(e) => onUpdate({ geo_country: e.target.value })}
            className="w-full mt-2 px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </div>

        {/* State */}
        <div>
          <Label htmlFor="state">State / Province *</Label>
          <Input
            id="state"
            value={data.geo_state}
            onChange={(e) => onUpdate({ geo_state: e.target.value })}
            placeholder="e.g., OR, California"
            className="mt-2"
          />
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={data.geo_city}
            onChange={(e) => onUpdate({ geo_city: e.target.value })}
            placeholder="e.g., Portland"
            className="mt-2"
          />
        </div>
      </div>

      {/* Radius Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Search Radius</Label>
          <span className="text-sm font-semibold text-primary">
            {data.geo_radius_miles} miles
          </span>
        </div>
        <Slider
          value={[data.geo_radius_miles]}
          onValueChange={([value]) => onUpdate({ geo_radius_miles: value })}
          min={5}
          max={100}
          step={5}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5 miles</span>
          <span>100 miles</span>
        </div>
      </div>

      {/* Location Preview */}
      <div className="bg-secondary/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Target Location</h3>
            <p className="text-sm text-muted-foreground">
              {data.geo_city && data.geo_state && data.geo_country ? (
                <>
                  <strong>{data.geo_city}, {data.geo_state}, {data.geo_country}</strong>
                  <br />
                  Within a {data.geo_radius_miles}-mile radius
                </>
              ) : (
                'Please fill in all location fields'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>💡 <strong>Tip:</strong> Start with a smaller radius (10-25 miles) for dense urban areas</p>
        <p>💡 <strong>Tip:</strong> Use larger radius (50-100 miles) for rural or suburban areas</p>
      </div>
    </div>
  );
}
