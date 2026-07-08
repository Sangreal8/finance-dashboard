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
      <DialogTrigger asChild>
        <Button className="rounded-full">Add transaction</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>

        <form className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g. Tesco" />
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input placeholder="42.18" type="number" />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Input placeholder="Groceries" />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" />
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
