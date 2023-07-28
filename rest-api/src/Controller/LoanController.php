<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Service\LoanCalculatorService;

#[Route('/api', name: 'api_')]
class LoanController extends AbstractController
{
    #[Route('/loan/generate', name: 'loan_generate', methods: ['POST'])]
    public function generate(Request $request): JsonResponse
    {
        $parameters = json_decode($request->getContent(), true);

        if ($response = $this->validateRequest($parameters)) {
            return $response;
        }

        $loanCalculator = new LoanCalculatorService(
            $parameters['amount'],
            $parameters['duration'],
            $parameters['interestRate']
        );
        $loanCalculator->calculate();

        // Imitating API delay
        sleep(1);

        return $this->json([
            'message' => [
                'monthlyEntries' => $loanCalculator->getMonthlyEntries(),
                'totals' => $loanCalculator->getTotals()
            ]
        ]);
    }

    #[Route('/loan/export', name: 'loan_export', methods: ['POST'])]
    public function export(Request $request): Response
    {
        $requestData = json_decode($request->getContent(), true);

        if (empty($requestData['rows'])) {
            return $this->json([
                'message' => 'Request rows are empty',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($requestData['filename'])) {
            return $this->json([
                'message' => 'Filename is not defined',
            ], Response::HTTP_BAD_REQUEST);
        }

        $csv = fopen('php://memory', 'w');

        for ($i = 0; $i < count($requestData['rows']); $i++) {
            fputcsv($csv, $requestData['rows'][$i]);
        }

        rewind($csv);
        $csvContent = stream_get_contents($csv);
        fclose($csv);

        $response = new Response($csvContent);
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="'.$requestData['filename'].'.csv"');

        // Also save file to server
        $filesystem = new Filesystem();
        $filesystem->dumpFile('export/user-export-'.md5(time()) . '.csv', $csvContent);

        return $response;
    }

    private function validateRequest(array $parameters): ?JsonResponse
    {
        if (empty($parameters['interestRate']))
        {
            return $this->json([
                'message' => 'Interest rate is required',
            ], Response::HTTP_BAD_REQUEST);
        } else if (!is_float($parameters['interestRate'])) {
            return $this->json([
                'message' => 'Interest rate must be a float value',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($parameters['amount']))
        {
            return $this->json([
                'message' => 'Amount is required',
            ], Response::HTTP_BAD_REQUEST);
        } else if (!is_numeric($parameters['amount'])) {
            return $this->json([
                'message' => 'Amount must be a number',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($parameters['duration']))
        {
            return $this->json([
                'message' => 'Duration is required',
            ], Response::HTTP_BAD_REQUEST);
        } else if (!is_int($parameters['duration'])) {
            return $this->json([
                'message' => 'Duration must be an integer value',
            ], Response::HTTP_BAD_REQUEST);
        }

        return null;
    }


}
