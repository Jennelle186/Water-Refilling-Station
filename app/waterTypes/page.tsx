import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const WaterTypes = async () => {

    const supabase = createServerComponentClient({ cookies });

    const {data: {session }} = await supabase.auth.getSession();
  
    if(!session){
      redirect('/login')
    }
    return (  
        <div>Water Types</div>
    );
}
 
export default WaterTypes;