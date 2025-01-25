import { getProductById } from '@/actions/product'
import PaymentProduct from '@/components/product-payment'
import { db } from '@normietech/core/database/index'
import { products } from '@normietech/core/database/schema/index'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function PaymentPage({
  params
}: {
  params: { productId: string }
}) {
  const product = await getProductById(params.productId)
  if(!product){
    return {error:"Product not found"}
  } 
  return (
    <PaymentProduct name={product.name} productId={params.productId} projectId={product.projectId} fixedAmount={product.priceInFiat}  />
  )
}