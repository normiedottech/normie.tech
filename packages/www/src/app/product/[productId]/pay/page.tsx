import { getProductById } from '@/actions/product'
import PaymentProduct from '@/components/product-payment'
export default async function PaymentPage({
  params,
  searchParams
}: {
  params: { productId: string },
  searchParams: { payoutAddress: string }
}) {
  const product = await getProductById(params.productId)
  if(!product){
    return {error:"Product not found"}
  } 
  return (
    <PaymentProduct payoutAddress={searchParams.payoutAddress} name={product.name} productId={params.productId} projectId={product.projectId} fixedAmount={product.priceInFiat} image={product.images?.[0] ?? ""} />
  )
}