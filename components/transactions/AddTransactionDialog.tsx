"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddTransactionDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button className="rounded-full">Add transaction</Button>}
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>

        <form className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-description">Description</Label>
            <Input id="transaction-description" placeholder="e.g. Tesco" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Amount</Label>
            <Input
              id="transaction-amount"
              placeholder="42.18"
              type="number"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-category">Category</Label>
            <Input id="transaction-category" placeholder="Groceries" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-date">Date</Label>
            <Input id="transaction-date" type="date" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>

            <Button type="submit">Save transaction</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
