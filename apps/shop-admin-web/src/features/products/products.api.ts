import z from "zod";
import { adminApi } from "../../lib/admin-api-client";

const ProductSchema = z.object({})

export async function listProducts() {
    const res = await adminApi.get("/products")
    const json = await res.json()
    return json
}

export const CreateProductSchema = z.object({
    name: z.string(),
    description: z.string().nullable()
})

export async function createProduct() {

}