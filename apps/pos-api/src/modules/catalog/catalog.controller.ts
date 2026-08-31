import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";
import { ListCatalogQueryDto } from "./dto/list-catalog-query.dto";
import { ScanQueryDto } from "./dto/scan-query.dto";
import { PosCatalogPage } from "./entities/pos-catalog-page.entity";
import { PosCatalogProduct } from "./entities/pos-catalog-product.entity";
import { PosScanResult } from "./entities/pos-scan-result.entity";
import { PosSession } from "./entities/pos-session.entity";
import {
  CurrentPosDevice,
  type PosDeviceContext,
} from "../pos-auth/pos-auth.decorators";

@ApiTags("catalog")
@ApiSecurity("PosDevice-auth")
@Controller("pos")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("catalog")
  @ApiOkResponse({ type: PosCatalogPage })
  list(
    @Query() query: ListCatalogQueryDto,
    @CurrentPosDevice() device: PosDeviceContext,
  ) {
    return this.catalogService.list(query, device);
  }

  @Get("catalog/scan")
  @ApiOkResponse({ type: PosScanResult })
  scan(
    @Query() query: ScanQueryDto,
    @CurrentPosDevice() device: PosDeviceContext,
  ) {
    return this.catalogService.scan(query.code, device);
  }

  @Get("catalog/:id")
  @ApiOkResponse({ type: PosCatalogProduct })
  @ApiNotFoundResponse()
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentPosDevice() device: PosDeviceContext,
  ) {
    return this.catalogService.findOne(id, device);
  }

  @Get("session")
  @ApiOkResponse({ type: PosSession })
  session(@CurrentPosDevice() device: PosDeviceContext) {
    return this.catalogService.session(device);
  }
}
