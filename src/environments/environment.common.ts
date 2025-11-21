import { environment } from "./environment"

const baseURL = `${environment.baseURL + 'api/'}`

export const environmentCommon = {
    api: {
         login: {
            
            REFRESH: baseURL + 'token/refresh'},
     
        image: {
            UPLOAD_IMAGE: baseURL + 'photo',
            GET_IMAGES: baseURL + 'photo',
            GET_IMAGE_BY_NAME: baseURL + 'photo/photos',
            GET_IMAGE_BY_NAMES: baseURL + 'photo',
            COVER_IMAGE: baseURL + 'album/cover',
            UPDATE_ORDER: baseURL + 'photos/update/order',
            DELETE: baseURL + 'delete/photos'
        },       
        aiphoto:{
            AI_SELFIE_QR:baseURL + 'album/qr/',

        },
    }
}
