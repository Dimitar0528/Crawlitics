"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Loader2, CheckCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductVariant } from "@/lib/validations/product";
import { BASE_EMAIL_FORM_SCHEMA, BaseEmailForm } from "@/lib/validations/form";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

type AvailabilityAlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variant: ProductVariant;
}

export default function AvailabilityAlertModal({
  isOpen,
  onClose,
}: AvailabilityAlertModalProps) {
    const { isSignedIn } = useUser();

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<BaseEmailForm>({
    resolver: zodResolver(BASE_EMAIL_FORM_SCHEMA),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: BaseEmailForm) => {
    if(!isSignedIn) return toast.warning(
      "Трябва да влезеш в акаунта си, за да достъпиш тази функционалност!"
    );
    setServerError(null);
    console.log(values);
  };

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setIsSuccess(false);
      setServerError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-purple-500" />
            Уведомяване за наличност
          </DialogTitle>
          <DialogDescription>
            Продуктът в момента е изчерпан. Въведете имейла си, за да получите
            еднократно известие, когато отново е наличен.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="font-medium text-lg">Заявката е приета!</p>
            <p className="text-muted-foreground">
              Ще ви пишем, когато продуктът се появи отново.
            </p>
            <Button onClick={onClose} className="mt-4">
              Затвори
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full">
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Изпрати
              </Button>
              {serverError && (
                <p className="text-center text-xs text-red-500">
                  {serverError}
                </p>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
