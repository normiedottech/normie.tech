import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Mail } from "lucide-react";
import { getErrorMessage } from "./actions/dashboard"; 
import { Button } from "@/components/ui/button";

export default async function AlertTab({projectId}:{projectId:string}) {
    const message = await getErrorMessage(projectId)
    return (
      <Alert variant="destructive" className="my-8 p-6 bg-red-100 border-red-500">
        <AlertTriangle className="h-8 w-8" />
        <AlertTitle className="text-2xl font-bold mb-2">Important Notice</AlertTitle>
        <AlertDescription className="text-lg">
          {message ? <p className="mb-4">{message}</p> : null}
          <p className="mb-4">To continue using our service, please contact us immediately.</p>

          <div className="flex flex-col sm:flex-row gap-4">
           
            <Button variant="outline" asChild>
              <a href="mailto:support@normie.tech" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" /> Email Support at <a href="mailto:support@normie.tech" className="underline">support@normie.tech</a>
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
}